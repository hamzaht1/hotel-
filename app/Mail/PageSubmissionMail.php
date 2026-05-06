<?php

namespace App\Mail;

use App\Models\Page;
use App\Models\PageSubmission;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PageSubmissionMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public PageSubmission $submission,
        public Page $page,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New form submission: ' . ($this->page->title_en ?: $this->page->title_ar),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.page-submission',
            with: [
                'submission' => $this->submission,
                'page' => $this->page,
                'fields' => $this->page->form_fields ?? [],
            ],
        );
    }
}
