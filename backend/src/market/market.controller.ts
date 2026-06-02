import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MarketService } from './market.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get('crypto')
  getCrypto(@Query('coin') coin: string) {
    return this.marketService.getCryptoPrice(coin ?? 'bitcoin');
  }

  @Get('gold-price')
  getGoldPrice() {
    return this.marketService.getGoldPrice();
  }

  @Get('news')
  getNews() {
    return this.marketService.getGoldNews();
  }

  

  @UseGuards(JwtAuthGuard)
  @Get('analytics')
  getAnalytics(
    @Query('symbol') symbol: string,
    @Query('interval') interval: string,
    @Query('limit') limit: string,
  ) {
    return this.marketService.getAnalytics(
      symbol ?? 'BTCUSDT',
      interval ?? '5m',
      Number(limit) || 20,
    );
  }

  // Proxy klines dari Binance — FE tidak bisa hit langsung karena ISP block
  @Get('klines')
  getKlines(
    @Query('symbol') symbol: string,
    @Query('interval') interval: string,
    @Query('limit') limit: string,
  ) {
    return this.marketService.getKlines(
      symbol ?? 'BTCUSDT',
      interval ?? '5m',
      Number(limit) || 500,
    );
  }
}