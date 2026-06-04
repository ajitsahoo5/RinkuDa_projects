import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/auth.decorators';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/auth.guards';
import {
  CreateFarmerDto,
  FarmerFilterQueryDto,
  UpdateFarmerDto,
} from './dto/farmer.dto';
import { FarmersService } from './farmers.service';

@Controller('farmers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class FarmersController {
  constructor(private readonly farmersService: FarmersService) {}

  @Get()
  findAll(@Query() filter: FarmerFilterQueryDto) {
    return this.farmersService.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.farmersService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateFarmerDto) {
    return this.farmersService.create(dto, true);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFarmerDto) {
    return this.farmersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.farmersService.remove(id);
  }
}
