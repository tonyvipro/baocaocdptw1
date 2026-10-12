<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Appointment;

class AppointmentRescheduledNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $appointment;
    protected $changer;

    /**
     * Create a new notification instance.
     */
    public function __construct(Appointment $appointment, $changer)
    {
        $this->appointment = $appointment;
        $this->changer = $changer; // Đối tượng User đã thực hiện dời lịch
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
            'title' => 'Lịch hẹn đã được dời',
            'message' => 'Lịch hẹn đã được ' . $this->changer->name . ' dời sang ' . $this->appointment->appointment_time,
            'type' => 'appointment_rescheduled'
        ];
    }
}
