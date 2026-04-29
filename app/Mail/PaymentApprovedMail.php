<?php

namespace App\Mail;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentApprovedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Tenant $tenant,
        public User $admin,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'تم تفعيل حسابك - Diyafah | Account Activated',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.payment-approved',
        );
    }
}
