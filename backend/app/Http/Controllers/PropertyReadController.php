<?php

namespace App\Http\Controllers;

use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class PropertyReadController extends Controller
{
    private function presentPrice(Property $property): Property
    {
        if ($property->relationLoaded('propertyType')) {
            if ($property->propertyType) $property->type = $property->propertyType->name;
            $property->unsetRelation('propertyType');
        }
        $rent = $property->purpose === 'rent';
        $field = $rent ? 'price_rent' : 'price_sale';
        $price = $property->price ?? $property->$field;
        if ($price !== null) {
            $property->$field = $price;
            $property->{$field.'_text'} = $rent ? round((float) $price / 1e6, 2).' triệu/tháng'
                : ((float) $price >= 1e9 ? round((float) $price / 1e9, 2).' tỷ' : round((float) $price / 1e6, 2).' triệu');
        }
        return $property;
    }

    public function publicIndex(Request $request)
    {
        // A reachable, empty database is an empty catalog, never demo data.
        $ownListings = $request->boolean('all') || $request->boolean('mine');
        $query = Property::with('propertyType');
        if ($ownListings) {
            abort_unless($request->user() && $request->user()->is_active, 401, 'Vui lòng đăng nhập lại.');
            $query->where('user_id', $request->user()->id);
        } else {
            $query->where('status', 1);
        }
        if (!$ownListings && Schema::hasColumn('properties', 'expire_date')) {
            $query->where(fn ($q) => $q->whereNull('expire_date')->orWhere('expire_date', '>=', now()));
        }
        $properties = $query->orderBy('id')->get()->map(function ($property) {
            if (!$property->street && $property->address) $property->street = $property->address;
            if ($property->expire_date) $property->expire_date = \Illuminate\Support\Carbon::parse($property->expire_date)->toISOString();
            return $this->presentPrice($property);
        });
        return response()->json($properties)->header('Cache-Control', 'no-store');
    }

    public function index(Request $request)
    {
        $query = Property::with('propertyType');
        if ($request->filled('search')) {
            $search = '%'.trim($request->string('search')->toString()).'%';
            $query->where(function ($q) use ($search) {
                foreach (['title', 'code', 'address', 'street', 'project'] as $field) {
                    $q->orWhere($field, 'like', $search);
                }
            });
        }
        foreach (['type', 'purpose', 'city'] as $field) {
            if ($request->filled($field) && $request->input($field) !== 'all') {
                $query->where($field, $request->input($field));
            }
        }
        $hasExpiry = Schema::hasColumn('properties', 'expire_date');
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $status = (int) $request->input('status');
            if ($hasExpiry && $status === 3) {
                $query->where(fn ($q) => $q->where('status', 3)->orWhere(fn ($expired) => $expired->where('status', 1)->where('expire_date', '<', now())));
            } else {
                $query->where('status', $status);
                if ($hasExpiry && $status === 1) $query->where(fn ($q) => $q->whereNull('expire_date')->orWhere('expire_date', '>=', now()));
            }
        }
        if (!$request->filled('status') && $request->boolean('exclude_pending')) {
            $query->where('status', '!=', 0);
        }
        [$column, $direction] = match ($request->input('sort', 'newest')) {
            'oldest' => ['created_at', 'asc'],
            'price-asc', 'price_asc' => ['price', 'asc'],
            'price-desc', 'price_desc' => ['price', 'desc'],
            'area-asc', 'area_asc' => ['area', 'asc'],
            'area-desc', 'area_desc' => ['area', 'desc'],
            default => ['created_at', 'desc'],
        };
        $page = $query->orderBy($column, $direction)->orderBy('id', $direction)
            ->paginate(max(1, min(100, $request->integer('per_page', 12))));
        $page->getCollection()->each(fn ($property) => $this->presentPrice($property));
        if ($hasExpiry) $page->getCollection()->each(function ($property) {
            if ($property->status === 1 && $property->expire_date && \Illuminate\Support\Carbon::parse($property->expire_date)->isPast()) $property->status = 3;
        });

        return response()->json([
            'data' => $page->items(),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'per_page' => $page->perPage(),
                'total' => $page->total(),
            ],
        ])->header('Cache-Control', 'no-store');
    }

    public function stats()
    {
        if (Schema::hasColumn('properties', 'expire_date')) {
            $counts = Property::query()->selectRaw('CASE WHEN status = 1 AND expire_date < ? THEN 3 ELSE status END AS effective_status, COUNT(*) AS aggregate', [now()])
                ->groupBy('effective_status')->pluck('aggregate', 'effective_status');
        } else {
            $counts = Property::query()->selectRaw('status, COUNT(*) AS aggregate')->groupBy('status')->pluck('aggregate', 'status');
        }
        $value = (float) Property::query()->sum('price');
        return response()->json([
            'total' => Property::count(),
            'active' => (int) ($counts[1] ?? 0),
            'sold' => (int) ($counts[2] ?? 0),
            'expired' => (int) ($counts[3] ?? 0),
            'pending' => (int) ($counts[0] ?? 0),
            'hidden' => (int) ($counts[4] ?? 0),
            'trash' => Property::onlyTrashed()->count(),
            'total_value_text' => round($value / 1000000000, 2).' tỷ',
        ])->header('Cache-Control', 'no-store')
            ->header('X-Database-Name', \Illuminate\Support\Facades\DB::connection()->getDatabaseName());
    }
}
