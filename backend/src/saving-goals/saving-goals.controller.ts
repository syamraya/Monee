import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { AddDepositDto, CreateSavingGoalDto } from "./dto/create-saving-goal.dto";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { SavingGoalsService } from "./saving-goals.service";

@Controller('saving-goals')
@UseGuards(JwtAuthGuard)
export class SavingGoalsController {
  constructor(private readonly savingGoalsService: SavingGoalsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateSavingGoalDto) {
    return this.savingGoalsService.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    const id = req.user.userId;
    return this.savingGoalsService.findAll(req.user.userId);
  }



@Patch(':id/deposit')
@UseGuards(JwtAuthGuard)
async addDeposit(
  @Param('id') goalId: string,
  @Req() req: any,
  @Body() dto: AddDepositDto 
) {
  return this.savingGoalsService.deposit(req.user.userId, goalId, dto);
}
}