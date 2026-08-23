import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentRegistryUser } from '../../common/decorators/current-registry-user.decorator';
import { RegistryRoles } from '../../common/decorators/registry-roles.decorator';
import { RegistryAuthGuard } from '../../common/guards/registry-auth.guard';
import { RegistryRolesGuard } from '../../common/guards/registry-roles.guard';
import type { RegistryAuthenticatedUser } from '../../common/types/registry-auth.types';
import {
  CreateRegistryUserDto,
  RegistryUserResponseDto,
  UpdateRegistryUserDto,
} from './dto/registry-user.dto';
import { RegistryUsersService } from './registry-users.service';

@ApiTags('Registry — Users')
@ApiBearerAuth('firebase')
@Controller('registry/users')
@UseGuards(RegistryAuthGuard, RegistryRolesGuard)
export class RegistryUsersController {
  constructor(private readonly usersService: RegistryUsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated registry user' })
  me(@CurrentRegistryUser() user: RegistryAuthenticatedUser): Promise<RegistryUserResponseDto> {
    return this.usersService.findOne(user.firebaseUid);
  }

  @Get()
  @RegistryRoles('admin')
  @ApiOperation({ summary: 'List all registry users (admin only)' })
  findAll(): Promise<RegistryUserResponseDto[]> {
    return this.usersService.findAll();
  }

  @Post()
  @RegistryRoles('admin')
  @ApiOperation({ summary: 'Create registry user profile (admin only)' })
  create(@Body() dto: CreateRegistryUserDto): Promise<RegistryUserResponseDto> {
    return this.usersService.create(dto);
  }

  @Patch(':uid')
  @RegistryRoles('admin')
  @ApiOperation({ summary: 'Update registry user (admin only)' })
  @ApiParam({ name: 'uid', description: 'Firebase UID' })
  update(
    @Param('uid') uid: string,
    @Body() dto: UpdateRegistryUserDto,
  ): Promise<RegistryUserResponseDto> {
    return this.usersService.update(uid, dto);
  }

  @Delete(':uid')
  @RegistryRoles('admin')
  @ApiOperation({ summary: 'Delete registry user (admin only, not self)' })
  @ApiParam({ name: 'uid', description: 'Firebase UID' })
  remove(
    @Param('uid') uid: string,
    @CurrentRegistryUser() user: RegistryAuthenticatedUser,
  ): Promise<void> {
    return this.usersService.remove(uid, user.firebaseUid);
  }
}
