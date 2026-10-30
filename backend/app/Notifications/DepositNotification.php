<?php

namespace App\Notifications;

use App\Models\ContractDeposit;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class DepositNotification extends Notification
{
    use Queueable;

    protected ContractDeposit $deposit;
    protected string $title;
    protected string $message;
    protected string $eventType;
    protected array $extra;

    public function __construct(
        ContractDeposit $deposit,
        string $title,
        string $message,
        string $eventType = 'deposit_event',
        array $extra = []
    ) {
        $this->deposit = $deposit;
        $this->title = $title;
        $this->message = $message;
        $this->eventType = $eventType;
        $this->extra = $extra;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $contract = $this->deposit->contract;

        return array_merge([
            'deposit_id' => $this->deposit->id,
            'contract_id' => $this->deposit->contract_id,
            'contract_code' => $contract?->contract_code,
            'invoice_id' => $this->deposit->invoice_id,
            'title' => $this->title,
            'message' => $this->message,
            'type' => $this->eventType,
        ], $this->extra);
    }
}

