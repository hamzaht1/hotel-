<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\PageSubmission;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PageSubmissionController extends Controller
{
    public function index(Page $page)
    {
        $submissions = $page->submissions()
            ->latest('id')
            ->paginate(25);

        return Inertia::render('super-admin/pages/submissions', [
            'page' => $page->only(['id', 'slug', 'title_ar', 'title_en', 'form_fields']),
            'submissions' => $submissions,
        ]);
    }

    public function destroy(Page $page, PageSubmission $submission)
    {
        abort_unless($submission->page_id === $page->id, 404);
        $submission->delete();
        return back()->with('success', 'تم حذف الاستجابة');
    }

    public function export(Page $page): StreamedResponse
    {
        $fields = $page->form_fields ?? [];
        $headers = ['#', 'Submitted at'];
        foreach ($fields as $f) {
            $headers[] = $f['label_en'] ?: $f['label_ar'] ?: $f['key'];
        }
        $headers[] = 'IP';

        $submissions = $page->submissions()->latest('id')->get();

        return response()->streamDownload(function () use ($headers, $submissions, $fields) {
            $out = fopen('php://output', 'w');
            fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($out, $headers);
            foreach ($submissions as $s) {
                $row = [$s->id, $s->created_at?->toDateTimeString()];
                foreach ($fields as $f) {
                    $v = $s->data[$f['key']] ?? '';
                    if (is_array($v)) $v = implode(', ', $v);
                    $row[] = $v;
                }
                $row[] = $s->ip;
                fputcsv($out, $row);
            }
            fclose($out);
        }, "submissions-{$page->slug}.csv", ['Content-Type' => 'text/csv']);
    }
}
