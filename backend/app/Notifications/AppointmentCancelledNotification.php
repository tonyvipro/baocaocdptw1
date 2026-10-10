<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Appointment;

class AppointmentCancelledNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $appointment;
    protected $canceler;
    protected $reason;

    /**
     * Create a new notification instance.
     */
    public function __construct(Appointment $appointment, $canceler, $reason)
    {
        $this->appointment = $appointment;
        $this->canceler = $canceler; // Ai là người hủy (User instance)
        $this->reason = $reason;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'appointment_id' => $this->appointment->id,
            'title' => 'Lịch hẹn đã bị hủy',
            'message' => 'Lịch hẹn lúc ' . $this->appointment->appointment_time . ' đã bị hủy bởi ' . $this->canceler->name,
            'reason' => $this->reason,
            'type' => 'appointment_cancelled'
        ];
    }
}
