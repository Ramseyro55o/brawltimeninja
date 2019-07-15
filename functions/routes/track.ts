import Router from 'koa-router';

import DatabaseService from '../services/Database';
import { Player, BattleLog } from '../model/Brawlstars';

const service = new DatabaseService();

const router = new Router();

router.get('/tracker/status', async (ctx, next) => {
  ctx.body = ({ 'status': 'ok' });
  await next();
});

router.post('/tracker/track', async (ctx, next) => {
  await service.store(<{ player: Player, battleLog: BattleLog }> ((<any> ctx.request).body));
  ctx.body = {};
  await next();
});

router.get('/tracker/top/exp', async (ctx, next) => {
  ctx.body = await service.getTopByExp(100);
  await next();
});

router.get('/tracker/history/:tag', async (ctx, next) => {
  ctx.body = await service.getHistory(ctx.params.tag);
  await next();
});

router.get('/tracker/meta/brawler', async (ctx, next) => {
  ctx.body = await service.getBrawlerMeta();
  await next();
});

router.get('/tracker/meta/map', async (ctx, next) => {
  ctx.body = await service.getMapMeta();
  await next();
});

export default router.routes();
