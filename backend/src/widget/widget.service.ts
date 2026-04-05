import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { WidgetRepository } from './widget.repo';
import { CreateWidgetBodyType, UpdateWidgetBodyType } from './widget.model';
import {
  WidgetTypeExistsException,
  WidgetNotFoundException,
} from './widget.error';
import { WidgetCategory } from '../generated/prisma/client';

@Injectable()
export class WidgetService {
  constructor(
    private readonly widgetRepository: WidgetRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async create(body: CreateWidgetBodyType) {
    const existing = await this.widgetRepository.findByType(body.type);
    if (existing) throw WidgetTypeExistsException;
    const widget = await this.widgetRepository.create(body);
    await this.cache.clear();
    return widget;
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
    const updated = await this.widgetRepository.update(id, body);
    await this.cache.clear();
    return updated;
  }

  async remove(id: string) {
    await this.findById(id);
    const result = await this.widgetRepository.softDelete(id);
    await this.cache.clear();
    return result;
  }
}
