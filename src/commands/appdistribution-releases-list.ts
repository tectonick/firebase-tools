import * as ora from "ora";
import { AppDistributionClient } from "../appdistribution/client";
import { getAppName } from "../appdistribution/options-parser-util";
import { ListReleasesResponse, Release } from "../appdistribution/types";
import { Command } from "../command";
import { FirebaseError } from "../error";
import { logger } from "../logger";
import { requireAuth } from "../requireAuth";
import { Options } from "../options";
import * as utils from "../utils";
import * as Table from "cli-table3";

interface ListReleasesOptions extends Options {
  app: string;
  filter?: string;
}

export const command = new Command("appdistribution:releases:list")
  .description("list App Distribution releases")
  .option("--app <app_id>", "the app id of your Firebase app")
  .option(
    "--filter <filter>",
    'Filters releases by their createTime or releaseNotes. Example: `createTime <= "2021-09-08T00:00:00+04:00" AND releaseNotes.text="fixes"`',
  )
  .before(requireAuth)
  .action(async (options?: ListReleasesOptions): Promise<ListReleasesResponse> => {
    const appName = getAppName(options);

    const appDistroClient = new AppDistributionClient();

    let releases: Release[];
    const spinner = ora("Preparing the list of your App Distribution Releases").start();
    try {
      releases = await appDistroClient.listReleases(appName, options?.filter);
    } catch (err: any) {
      spinner.fail();
      throw new FirebaseError("Failed to list groups.", {
        exit: 1,
        original: err,
      });
    }
    spinner.succeed();
    printReleasesTable(releases);
    utils.logSuccess(`Releases listed successfully`);
    return { releases };
  });

/**
 * Prints a table given a list of releases
 */
function printReleasesTable(releases: Release[]): void {
  const tableHead = ["Release Name", "Build Version", "Display Version", "Create Time"];

  const table = new Table({
    head: tableHead,
    style: { head: ["green"] },
  });

  for (const release of releases) {
    table.push([
      release.name,
      release.buildVersion,
      release.displayVersion,
      new Date(release.createTime).toLocaleString(),
    ]);
  }

  logger.info(table.toString());
}
