import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import { constants, BaseSchemaType } from '@app/shared';

@Injectable()
export class UtilsService {
  private dayjsWithUtc: typeof dayjs;
  constructor(private clsService: ClsService) {
    dayjs.extend(utc);
    this.dayjsWithUtc = dayjs;
  }

  isObjectEmpty = (objectName: object) => {
    return (
      objectName &&
      Object.keys(objectName).length === 0 &&
      objectName.constructor === Object
    );
  };

  setCreatedAtAndCreatedBy<T extends Partial<BaseSchemaType>>(entity: T): T {
    const createdAt = this.dayjsWithUtc
      .utc()
      .format(constants.UTC_TIME_PATTERN);
    const sessionUser = this.clsService.get('session')?.user;
    const userId = sessionUser?.id;
    entity.createdAt = createdAt;
    entity.createdBy = userId || 'system';
    entity.updatedAt = createdAt;
    entity.updatedBy = userId || 'system';
    return entity;
  }

  setUpdatedAtAndUpdatedBy<T extends Partial<BaseSchemaType>>(entity: T): T {
    const updatedAt = this.dayjsWithUtc
      .utc()
      .format(constants.UTC_TIME_PATTERN);
    const userId = this.clsService.get('session')?.user?.id;
    entity.updatedAt = updatedAt;
    entity.updatedBy = userId;
    return entity;
  }

  setDeletedAtAndDeletedBy<T extends Partial<BaseSchemaType>>(entity: T): T {
    const deletedAt = this.dayjsWithUtc
      .utc()
      .format(constants.UTC_TIME_PATTERN);
    const userId = this.clsService.get('session')?.user?.id;
    entity.updatedAt = deletedAt;
    entity.updatedBy = userId;
    entity.deletedAt = deletedAt;
    entity.deletedBy = userId;
    return entity;
  }

  getCurrentUserId(): string {
    return this.clsService.get('session')?.user?.id || 'system';
  }

  addHeaders(data: any) {
    const session = this.clsService.get('session');

    return {
      ...data,
      headers: {
        session,
      },
    };
  }
}
