import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { InternalRoles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateFiscalDocumentDto } from './dto/create-fiscal-document.dto';
import { FiscalDocumentService } from './fiscal_document.service';

@Controller('fiscal-document')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@InternalRoles('admin')
export class FiscalDocumentController {
  constructor(private readonly fiscalDocumentService: FiscalDocumentService) {}

  @Get()
  findAll() {
    return this.fiscalDocumentService.findAll();
  }

  @Post()
  create(
    @Body() createFiscalDocumentDto: CreateFiscalDocumentDto,
    @Req() req: Request,
  ) {
    const actor = (req.user as any)?.username || (req.user as any)?.userId;
    return this.fiscalDocumentService.create(createFiscalDocumentDto, actor);
  }
}
