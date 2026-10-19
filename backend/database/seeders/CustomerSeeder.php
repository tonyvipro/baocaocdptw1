<?php

namespace Database\Seeders;

use App\Models\BrokerAssignment;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $managers = User::where('is_active', true)->whereIn('role_id', [1, 2])->orderBy('role_id', 'desc')->orderBy('id')->get();
        $admin = $managers->firstWhere('role_id', 1);
        $defaultOwner = $managers->first();
        $rows = [
            ['seed_key' => 'reference:pham-van-e', 'name' => 'Phạm Văn E', 'company' => 'Cty MNO', 'email' => 'pham.e@mno.example', 'phone' => '0888123456', 'customer_group' => 'new', 'status' => 'new', 'source' => 'Giới thiệu', 'created_at' => '2023-10-25 02:00:00'],
            ['seed_key' => 'reference:le-thi-c', 'name' => 'Lê Thị C', 'company' => null, 'email' => 'le.c@example.com', 'phone' => '0901234567', 'customer_group' => 'potential', 'status' => 'contacted', 'source' => 'Tự do', 'created_at' => '2023-10-11 02:00:00'],
        ];
        // Bring the project's seeded customer accounts and broker leads into CRM.
        foreach (User::where('role_id', 5)->orderBy('id')->get() as $user) {
            $rows[] = ['seed_key' => 'user:'.$user->id, 'name' => $user->name, 'email' => $user->email, 'phone' => $this->phone($user->phone),
                'customer_group' => 'new', 'status' => 'new', 'source' => 'Website', 'created_at' => $user->created_at];
        }
        if (Schema::hasTable('broker_assignments')) {
            foreach (BrokerAssignment::with('broker')->orderBy('id')->get() as $assignment) {
                $rows[] = ['seed_key' => 'assignment:'.$assignment->id, 'name' => $assignment->customer_name, 'email' => $assignment->customer_email,
                    'phone' => $this->phone($assignment->customer_phone), 'source' => 'Phân công môi giới',
                    'customer_group' => 'potential', 'status' => match ($assignment->status) { 'completed' => 'won', 'cancelled' => 'lost', 'processing' => 'contacted', default => 'new' },
                    'assigned_to' => $managers->firstWhere('id', $assignment->broker?->user_id)?->id,
                    'created_at' => $assignment->created_at];
            }
        }
        foreach ($rows as $index => $row) {
            DB::transaction(function () use ($row, $index, $managers, $admin, $defaultOwner) {
                // A stable key prevents reseeding edited or deleted contacts.
                if (Customer::withTrashed()->where('seed_key', $row['seed_key'])->exists()) return;
                $existing = Customer::withTrashed()->where(function ($query) use ($row) {
                    if (!empty($row['email'])) $query->where('email', $row['email']);
                    elseif (!empty($row['phone'])) $query->where('phone', $row['phone']);
                    else $query->where('name', $row['name']);
                })->exists();
                if ($existing) return;
                $owner = $row['assigned_to'] ?? ($managers->isNotEmpty() ? $managers[$index % $managers->count()]->id : null);
                $seedKey = $row['seed_key'];
                unset($row['seed_key']);
                $customer = new Customer;
                $customer->forceFill(array_merge($row, ['seed_key' => $seedKey, 'assigned_to' => $owner, 'created_by' => $admin?->id ?? $defaultOwner?->id]));
                $customer->save();
                if ($seedKey === 'reference:le-thi-c') {
                    $customer->interactions()->create(['type' => 'call', 'summary' => 'Trao đổi nhu cầu và tư vấn bất động sản phù hợp.',
                        'occurred_at' => now()->subDay(), 'actor_id' => $owner]);
                    $customer->activities()->create(['type' => 'email', 'title' => 'Gửi báo giá bất động sản phù hợp',
                        'scheduled_at' => now()->addDays(2)->setTime(2, 0), 'created_by' => $owner]);
                }
            });
        }
    }

    private function phone(?string $value): ?string
    {
        $digits = preg_replace('/[^0-9]/', '', $value ?? '');
        return preg_match('/^[0-9]{10,11}$/D', $digits) ? $digits : null;
    }
}
