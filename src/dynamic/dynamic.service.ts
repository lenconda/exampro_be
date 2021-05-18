import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import { ERR_DYNAMIC_CONFIG_EXISTS } from 'src/constants';
import { queryWithPagination } from 'src/utils/pagination';
import { In, Repository } from 'typeorm';
import { Dynamic } from './dynamic.entity';

@Injectable()
export class DynamicService {
  constructor(
    @InjectRepository(Dynamic)
    private readonly dynamicRepository: Repository<Dynamic>,
  ) {}

  async createDynamicConfig(pathname: string, content: string) {
    const existedDynamicConfig = await this.dynamicRepository.findOne({
      where: {
        pathname,
      },
    });
    if (existedDynamicConfig) {
      throw new BadRequestException(ERR_DYNAMIC_CONFIG_EXISTS);
    }
    const newDynamicConfig = this.dynamicRepository.create({
      pathname,
      content,
    });
    await this.dynamicRepository.save(newDynamicConfig);
    return newDynamicConfig;
  }

  async updateDynamicConfig(id: number, updates: Partial<Dynamic>) {
    await this.dynamicRepository.update(
      {
        id,
      },
      {
        ..._.pick(updates, ['pathname', 'content']),
      },
    );
    return;
  }

  async queryDynamicConfigs(
    lastCursor: number,
    size = 10,
    order = 'asc',
    search = '',
    page = 0,
  ) {
    return await queryWithPagination<number, Dynamic>(
      this.dynamicRepository,
      lastCursor,
      order.toUpperCase() as 'ASC' | 'DESC',
      size,
      {
        search,
        searchColumns: ['pathname', 'content'],
        page,
      },
    );
  }

  async deleteDynamicConfigs(ids: number[]) {
    const configs = await this.dynamicRepository.find({
      where: {
        id: In(ids),
      },
    });
    if (configs.length) {
      await this.dynamicRepository.delete(configs.map((config) => config.id));
    }
  }

  async getDynamicConfigDetail(pathname: string) {
    const result = await this.dynamicRepository.findOne({
      where: {
        pathname,
      },
    });
    if (result) {
      return result;
    } else {
      return {};
    }
  }
}
