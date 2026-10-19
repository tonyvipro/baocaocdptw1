<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserManagementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [];
        for ($i = 1; $i <= 10; $i++) {
            $users[] = [
                'name' => 'Người Dùng Mẫu ' . $i,
                'email' => 'user' . $i . '@demo.com',
                'password' => Hash::make('Password@123'),
                'phone' => '090' . rand(1000000, 9999999),
                'role_id' => rand(1, 5), // Random role from 1 to 5
                'avatar' => 'https://ui-avatars.com/api/?name=User+' . $i . '&background=random',
                'is_active' => 1,
                'dark_mode' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('users')->insert($users);
    }
}
