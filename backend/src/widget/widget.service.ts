import { Injectable } from '@nestjs/common';
import { WidgetRepository } from './widget.repo';
import { CreateWidgetBodyType, UpdateWidgetBodyType } from './widget.model';
import { WidgetTypeExistsException, WidgetNotFoundException } from './widget.error';
import { WidgetCategory } from '../generated/prisma/client';

@Injectable()
export class WidgetService {
  constructor(private readonly widgetRepository: WidgetRepository) {}

  async create(body: CreateWidgetBodyType) {
    const existing = await this.widgetRepository.findByType(body.type);
    if (existing) throw WidgetTypeExistsException;
    return this.widgetRepository.create(body);
  }

  findAll(filters?: { category?: WidgetCategory; isActive?: boolean }) {
    return this.widgetRepository.findAll(filters);
  }

  async findById(id: string) {
    const widget = await this.widgetRepository.findById(id);
    if (!widget) throw WidgetNotFoundException;
    return widget;
  }

  async update(id: string, body: UpdateWidgetBodyType) {
    await this.findById(id);
    if (body.type) {
      const existing = await this.widgetRepository.findByType(body.type);
      if (existing && existing.id !== id) throw WidgetTypeExistsException;
    }
    return this.widgetRepository.update(id, body);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.widgetRepository.softDelete(id);
  }
}
