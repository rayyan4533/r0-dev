#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/1e8412e162dbbe69f4bb3bf8d07f0280ae67eaab15c34dcf201e67468315428d/contract';
import startContract from '../../snapshots/1e8412e162dbbe69f4bb3bf8d07f0280ae67eaab15c34dcf201e67468315428d/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/c3caed31de7dcef601f6598a5e2b99c8971d31ee67ca1d2e02e3d2ab86de8c14/contract';
import endContract from '../../snapshots/c3caed31de7dcef601f6598a5e2b99c8971d31ee67ca1d2e02e3d2ab86de8c14/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, placeholder } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('firstName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('imageUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('lastName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('clerkId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.dataTransform(endContract, 'backfill-user-clerkId', {
        check: () => placeholder('backfill-user-clerkId:check'),
        run: () => placeholder('backfill-user-clerkId:run'),
      }),
      this.setNotNull({ schema: 'public', table: 'user', column: 'clerkId' }),
      this.dropNotNull({ schema: 'public', table: 'user', column: 'email' }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_clerkId_key',
        columns: ['clerkId'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
