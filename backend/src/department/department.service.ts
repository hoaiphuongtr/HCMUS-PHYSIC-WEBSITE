import { Injectable } from '@nestjs/common';
import { DepartmentRepository } from './department.repo';
import {
  CreateDepartmentBodyType,
  UpdateDepartmentBodyType,
} from './department.model';
import {
  DepartmentSlugExistsException,
  DepartmentNotFoundException,
} from './department.error';

@Injectable()
export class DepartmentService {
  constructor(private readonly departmentRepository: DepartmentRepository) {}

  async create(body: CreateDepartmentBodyType) {
    const existing = await this.departmentRepository.findBySlug(body.slug);
    if (existing) throw DepartmentSlugExistsException;
    return this.departmentRepository.create(body);
  }

  findAll() {
    return this.departmentRepository.findAll();
  }

  async findById(id: string) {
    const department = await this.departmentRepository.findById(id);
    if (!department) throw DepartmentNotFoundException;
    return department;
  }

  async update(id: string, body: UpdateDepartmentBodyType) {
    await this.findById(id);
    if (body.slug) {
      const existing = await this.departmentRepository.findBySlug(body.slug);
      if (existing && existing.id !== id) throw DepartmentSlugExistsException;
    }
    return this.departmentRepository.update(id, body);
  }
}
