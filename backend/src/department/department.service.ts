import { Injectable } from '@nestjs/common';
import { DepartmentRepository } from './department.repo';
import { CreateDepartmentBodyType } from './department.model';
import { DepartmentSlugExistsException } from './department.error';

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
}
