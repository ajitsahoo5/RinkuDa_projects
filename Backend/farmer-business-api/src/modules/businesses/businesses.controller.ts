import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/types/auth.types';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/create-business.dto';

@ApiTags('Platform — Businesses')
@ApiBearerAuth('firebase')
@Controller('businesses')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Post()
  @Roles(UserRole.PLATFORM_SUPER_ADMIN)
  @ApiOperation({ summary: 'Create business (platform super admin)' })
  create(@Body() dto: CreateBusinessDto, @CurrentUser() user: AuthenticatedUser) {
    return this.businessesService.create(dto, user);
  }

  @Get()
  @Roles(UserRole.PLATFORM_SUPER_ADMIN)
  @ApiOperation({ summary: 'List businesses (platform super admin)' })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.businessesService.listForPlatform(user);
  }

  @Get('mine')
  @Roles(UserRole.BUSINESS_SUPER_ADMIN, UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Get own business' })
  mine(@CurrentUser() user: AuthenticatedUser) {
    return this.businessesService.mine(user);
  }
}
