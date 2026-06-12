<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\EstablishmentDocument;
use App\Support\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class DocumentController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(['cr', 'tourism_license', 'municipality_license', 'zatca', 'other'])],
            'title' => 'required|string|max:150',
            'expires_at' => 'nullable|date',
            'file' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $path = $request->file('file')->store('establishment-documents', 'public');

        $document = EstablishmentDocument::create([
            'tenant_id' => app('current_tenant_id'),
            'type' => $validated['type'],
            'title' => $validated['title'],
            'file_path' => $path,
            'expires_at' => $validated['expires_at'] ?? null,
            'status' => 'active',
            'uploaded_by' => $request->user()->id,
        ]);

        ActivityLogger::log('document.uploaded', "Document «{$document->title}» uploaded", [
            'type' => $document->type,
        ], $document);

        return back()->with('success', 'تم رفع المستند بنجاح');
    }

    public function destroy(EstablishmentDocument $document)
    {
        if ($document->tenant_id !== app('current_tenant_id')) {
            abort(403);
        }

        if ($document->file_path) {
            Storage::disk('public')->delete($document->file_path);
        }

        $title = $document->title;
        $document->delete();

        ActivityLogger::log('document.deleted', "Document «{$title}» deleted");

        return back()->with('success', 'تم حذف المستند');
    }
}
