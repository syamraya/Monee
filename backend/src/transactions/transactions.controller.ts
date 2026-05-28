import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common'; 
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.transactionsService.findAll(req.user.userId);
  }
  
  @Get('stats')
  async getStats(@Req() req: any) {
  const userId = req.user.userId;
  return this.transactionsService.getStats(userId);
} 
}