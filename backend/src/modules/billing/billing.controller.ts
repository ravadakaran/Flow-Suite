import { Controller, Post, Body, Headers, Req, RawBodyRequest, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('webhook')
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.billingService.handleWebhook(req.rawBody!, signature);
  }

  @Post('checkout')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  createCheckout(
    @CurrentUser() user: any,
    @Body() body: { priceId?: string; planId?: string; successUrl?: string; cancelUrl?: string },
  ) {
    const priceId = body.priceId || body.planId || 'starter';
    const successUrl = body.successUrl || 'http://localhost:5173/dashboard/billing?status=success';
    const cancelUrl = body.cancelUrl || 'http://localhost:5173/dashboard/billing?status=cancelled';
    return this.billingService.createCheckoutSession(
      user.tenantId,
      priceId,
      successUrl,
      cancelUrl,
    );
  }
}
