<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('invoices')) {
            return;
        }

        // Thêm index cho paid_at trên invoices nếu chưa có (bọc try-catch an toàn cho cả MySQL và SQLite)
        try {
            Schema::table('invoices', function (Blueprint $table) {
                $table->index(['paid_at'], 'invoices_paid_at_index');
            });
        } catch (\Throwable $e) {
            // Index đã tồn tại hoặc không hỗ trợ, bỏ qua
        }

        // 1. Quét và chuẩn hóa dữ liệu cũ trong bảng invoices
        $invoices = DB::table('invoices')->orderBy('id')->get();
        $unidentifiedRecords = [];

        foreach ($invoices as $inv) {
            $updates = [];
            $paidAt = $inv->paid_at;
            $paidAmount = $inv->paid_amount ?? 0;

            // Nếu đã thanh toán (status = 1) mà chưa có paid_at
            if ($inv->status == 1 && empty($paidAt)) {
                $candidateDate = $inv->updated_at ?? $inv->created_at;
                if (!$candidateDate) {
                    $unidentifiedRecords[] = [
                        'invoice_id' => $inv->id,
                        'invoice_no' => $inv->invoice_no ?? ('ID:' . $inv->id),
                        'reason' => 'Không có cả updated_at lẫn created_at'
                    ];
                    $paidAt = Carbon::now('Asia/Ho_Chi_Minh')->toDateTimeString();
                } else {
                    $paidAt = Carbon::parse($candidateDate, 'Asia/Ho_Chi_Minh')->toDateTimeString();
                }
                $updates['paid_at'] = $paidAt;

                if ($paidAmount <= 0) {
                    $paidAmount = $inv->amount;
                    $updates['paid_amount'] = $paidAmount;
                }
            } elseif ($paidAmount > 0 && empty($paidAt)) {
                // Hóa đơn thanh toán một phần nhưng chưa có ngày thu
                $latestTx = Schema::hasTable('transactions')
                    ? DB::table('transactions')
                        ->where('invoice_id', $inv->id)
                        ->where('status', 1)
                        ->whereNotNull('paid_at')
                        ->orderByDesc('paid_at')
                        ->first()
                    : null;

                if ($latestTx && $latestTx->paid_at) {
                    $paidAt = $latestTx->paid_at;
                } else {
                    $candidateDate = $inv->updated_at ?? $inv->created_at;
                    if (!$candidateDate) {
                        $unidentifiedRecords[] = [
                            'invoice_id' => $inv->id,
                            'invoice_no' => $inv->invoice_no ?? ('ID:' . $inv->id),
                            'reason' => 'Thanh toán một phần nhưng thiếu timestamp ngày thu'
                        ];
                        $paidAt = Carbon::now('Asia/Ho_Chi_Minh')->toDateTimeString();
                    } else {
                        $paidAt = Carbon::parse($candidateDate, 'Asia/Ho_Chi_Minh')->toDateTimeString();
                    }
                }
                $updates['paid_at'] = $paidAt;
            }

            if (!empty($updates)) {
                DB::table('invoices')->where('id', $inv->id)->update($updates);
            }

            // 2. Đồng bộ vào transactions nếu hóa đơn đã thanh toán đầy đủ mà chưa có transaction nào
            if (Schema::hasTable('transactions') && $inv->status == 1 && $paidAmount > 0) {
                $hasTx = DB::table('transactions')->where('invoice_id', $inv->id)->exists();
                if (!$hasTx) {
                    $effectivePaidAt = $paidAt ?? ($inv->updated_at ?? $inv->created_at ?? Carbon::now('Asia/Ho_Chi_Minh')->toDateTimeString());
                    $dateStr = Carbon::parse($effectivePaidAt, 'Asia/Ho_Chi_Minh')->format('Ymd');
                    $seq = str_pad($inv->id, 6, '0', STR_PAD_LEFT);
                    $txCode = "TXN-MIG-{$dateStr}-{$seq}";

                    // Đảm bảo mã giao dịch duy nhất
                    $cnt = 1;
                    while (DB::table('transactions')->where('transaction_code', $txCode)->exists()) {
                        $txCode = "TXN-MIG-{$dateStr}-{$seq}-{$cnt}";
                        $cnt++;
                    }

                    DB::table('transactions')->insert([
                        'invoice_id' => $inv->id,
                        'transaction_code' => $txCode,
                        'amount' => $paidAmount,
                        'payment_method' => 'bank_transfer',
                        'paid_at' => $effectivePaidAt,
                        'source' => 'manual',
                        'status' => 1,
                        'note' => 'Đồng bộ từ hóa đơn đã thanh toán lịch sử (Migration backfill)',
                        'created_at' => $inv->created_at ?? $effectivePaidAt,
                        'updated_at' => $inv->updated_at ?? $effectivePaidAt,
                    ]);
                }
            }
        }

        if (!empty($unidentifiedRecords)) {
            Log::warning('Các bản ghi hóa đơn không xác định được ngày thanh toán chính xác trong quá trình migration:', $unidentifiedRecords);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('invoices')) {
            try {
                Schema::table('invoices', function (Blueprint $table) {
                    $table->dropIndex('invoices_paid_at_index');
                });
            } catch (\Throwable $e) {
                // Ignore
            }
        }
    }
};
