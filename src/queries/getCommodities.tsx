import { query } from "@solidjs/router";
import { getCommodities } from "~/server/db";

const getCommoditiesQuery = query(async () => {
  'use server;'

  return await getCommodities();
}, 'get-commodities');

export { getCommoditiesQuery as getCommodities };
