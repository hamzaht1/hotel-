<?php

namespace App\Services;

use App\Models\Conversation;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiSuggestionService
{
    /**
     * @return string[]
     */
    public function suggest(Conversation $conversation): array
    {
        $apiKey = config('services.anthropic.api_key');
        if (!$apiKey) {
            return $this->fallback();
        }

        $transcript = $this->buildTranscript($conversation);
        $isArabic = $this->isArabic($transcript);

        try {
            $response = Http::timeout(20)
                ->withHeaders([
                    'x-api-key' => $apiKey,
                    'anthropic-version' => '2023-06-01',
                    'content-type' => 'application/json',
                ])
                ->post('https://api.anthropic.com/v1/messages', [
                    'model' => config('services.anthropic.model', 'claude-haiku-4-5'),
                    'max_tokens' => 600,
                    'system' => $this->systemPrompt($isArabic),
                    'messages' => [[
                        'role' => 'user',
                        'content' => "Conversation transcript:\n\n{$transcript}\n\nReturn exactly 3 short reply suggestions, one per line, no numbering, no quotes, no extra commentary.",
                    ]],
                ]);

            if (!$response->ok()) {
                Log::warning('AI suggestions: non-OK response', ['status' => $response->status(), 'body' => $response->body()]);
                return $this->fallback();
            }

            $text = $response->json('content.0.text', '');
            $lines = array_values(array_filter(array_map('trim', preg_split('/\r?\n/', $text)), fn ($l) => $l !== ''));

            return array_slice($lines, 0, 3);
        } catch (\Throwable $e) {
            Log::warning('AI suggestions failed', ['error' => $e->getMessage()]);
            return $this->fallback();
        }
    }

    private function systemPrompt(bool $isArabic): string
    {
        if ($isArabic) {
            return "أنت مساعد لموظف دعم في منصة 'ضيافة' (نظام لإدارة الفنادق). اقترح ٣ ردود قصيرة ومهنية على آخر رسالة من العميل، باللغة نفسها التي يستخدمها العميل. ردود مباشرة وقصيرة، بدون ترقيم أو علامات اقتباس.";
        }
        return "You are an assistant for a support agent on the Diyafah platform (hotel management). Suggest 3 short, professional replies to the customer's latest message, in the same language they used. Direct and brief — no numbering, no quotes.";
    }

    private function buildTranscript(Conversation $conversation): string
    {
        $lines = ["Subject: {$conversation->subject}", "Category: {$conversation->category}", ''];
        foreach ($conversation->messages as $m) {
            $role = $m->sender_type === 'admin' ? 'Agent' : 'Customer';
            $lines[] = "{$role} ({$m->sender_name}): {$m->body}";
        }
        return implode("\n", $lines);
    }

    private function isArabic(string $text): bool
    {
        return (bool) preg_match('/[\x{0600}-\x{06FF}]/u', $text);
    }

    /**
     * @return string[]
     */
    private function fallback(): array
    {
        return [
            'هل يمكنك مشاركة لقطة شاشة للمشكلة؟',
            'سأقوم بتصعيد هذا إلى فريق التكامل فوراً.',
            'تم استلام طلبك، نعمل على حله الآن.',
        ];
    }
}
