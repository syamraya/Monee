import { Controller, Post, Get, Body, UseGuards, Request, Delete, Param } from '@nestjs/common';
import { RecurrentTransactionsService } from './recurrent-transactions.service';
import { CreateRecurrentDto } from './dto/create-recurrent.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('recurrent-transactions')
@UseGuards(JwtAuthGuard)
export class RecurrentTransactionsController {
  constructor(private readonly service: RecurrentTransactionsService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateRecurrentDto) {
    return this.service.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Request() req) {
    return this.service.findAll(req.user.userId);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.service.remove(id, req.user.userId);
  }
}