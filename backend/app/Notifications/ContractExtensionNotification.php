<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\ContractExtension;

class ContractExtensionNotification extends Notification
{
    use Queueable;

    protected $extension;
    protected $title;
    protected $message;
    protected $notificationType;

    public function __construct(ContractExtension $extension, string $title, string $message, string $notificationType = 'contract_extension')
    {
        $this->extension = $extension;
        $this->title = $title;
        $this->message = $message;
        $this->notificationType = $notificationType;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'extension_id' => $this->extension->id,
            'contract_id' => $this->extension->contract_id,
            'contract_code' => $this->extension->contract->contract_code ?? 'N/A',
            'title' => $this->title,
            'message' => $this->message,
            'status' => $this->extension->status,
            'type' => $this->notificationType,
        ];
    }
}
