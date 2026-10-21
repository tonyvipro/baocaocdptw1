<?php

namespace App\Notifications;

use App\Models\Contract;
use App\Models\ContractDocument;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ContractDocumentNotification extends Notification
{
    use Queueable;

    protected Contract $contract;
    protected ContractDocument $document;
    protected string $title;
    protected string $message;

    public function __construct(Contract $contract, ContractDocument $document, string $title, string $message)
    {
        $this->contract = $contract;
        $this->document = $document;
        $this->title = $title;
        $this->message = $message;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'contract_id' => $this->contract->id,
            'contract_code' => $this->contract->contract_code,
            'document_id' => $this->document->id,
            'document_title' => $this->document->title ?: $this->document->original_name,
            'document_type' => $this->document->document_type,
            'title' => $this->title,
            'message' => $this->message,
            'type' => 'contract_document_new',
        ];
    }
}
