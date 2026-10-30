<?php

namespace App\Services\Gateways;

use App\Contracts\PaymentGatewayInterface;
use InvalidArgumentException;

class GatewayManager
{
    protected array $gateways = [];

    public function gateway(?string $name = null): PaymentGatewayInterface
    {
        $name = strtolower($name ?: config('payment.default', 'sepay'));

        if (!isset($this->gateways[$name])) {
            $this->gateways[$name] = $this->resolve($name);
        }

        return $this->gateways[$name];
    }

    protected function resolve(string $name): PaymentGatewayInterface
    {
        return match ($name) {
            'sepay' => new SepayGateway(),
            'mock' => new MockGateway(),
            'momo' => new MomoGateway(),
            default => throw new InvalidArgumentException("Cổng thanh toán '{$name}' không được hỗ trợ trong hệ thống."),
        };
    }
}
