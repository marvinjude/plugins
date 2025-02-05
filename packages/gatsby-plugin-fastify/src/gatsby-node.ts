import { writeJSON } from "fs-extra";

import type { GatsbyNodeServerConfig } from "./utils/config";
import type { GatsbyNode } from "gatsby";

import { makePluginData } from "./utils/plugin-data";
import { getFunctionManifest } from "./gatsby/functionsManifest";
import { CONFIG_FILE_NAME } from "./utils/constants";
import { getClientSideRoutes } from "./gatsby/clientSideRoutes";
import { getServerSideRoutes } from "./gatsby/serverRoutes";

export const onPostBuild: GatsbyNode["onPostBuild"] = async (
  { store, pathPrefix, reporter },
  pluginOptions: GatsbyNodeServerConfig
) => {
  const { redirects } = store.getState();

  try {
    const pluginData = await makePluginData(store, pathPrefix);

    const functions = await getFunctionManifest(pluginData);
    const clientSideRoutes = await getClientSideRoutes(pluginData);
    const serverSideRoutes = await getServerSideRoutes(pluginData);

    // @ts-ignore
    delete pluginOptions.plugins;

    const config: GatsbyNodeServerConfig = {
      ...pluginOptions,
      clientSideRoutes,
      serverSideRoutes,
      redirects,
      prefix: pathPrefix,
      functions,
    };

    await writeJSON(pluginData.configFolder(CONFIG_FILE_NAME), config, { spaces: 2 });
  } catch (e) {
    reporter.error("Error building config for Fastify Server", e, "gatsby-plugin-fastify");
  }
};

export const pluginOptionsSchema: GatsbyNode["pluginOptionsSchema"] = ({ Joi }) => {
  return Joi.object({
    compression: Joi.boolean().default(true),
  });
};
