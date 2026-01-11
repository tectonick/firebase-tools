import * as ora from "ora";
import * as clc from "colorette";
import { AppDistributionClient } from "../appdistribution/client";
import { Release } from "../appdistribution/types";
import { Command } from "../command";
import { FirebaseError } from "../error";
import { logger } from "../logger";
import { requireAuth } from "../requireAuth";
import { Options } from "../options";
import * as utils from "../utils";
import * as Table from "cli-table3";

interface GetReleasesOptions extends Options {
  app: string;
  releaseName: string;
}

export const command = new Command("appdistribution:releases:get")
  .description("get App Distribution release details")
  .option("--app <app_id>", "the app id of your Firebase app")
  .option("--release-name <name>", "the name of the release to get details for")
  .before(requireAuth)
  .action(async (options?: GetReleasesOptions): Promise<Release> => {
    const releaseName = options?.releaseName;

    if (!releaseName) {
      throw new FirebaseError("Release name is required to get release details.", { exit: 1 });
    }

    const appDistroClient = new AppDistributionClient();

    let release: Release | undefined;

    const spinner = ora("Retrieving the App Distribution Release details").start();
    try {
      release = await appDistroClient.getRelease(releaseName);
    } catch (err: any) {
      spinner.fail();
      throw new FirebaseError("Failed to get release details.", {
        exit: 1,
        original: err,
      });
    }
    spinner.succeed();
    printReleaseDetails(release);
    utils.logSuccess(`Release details retrieved successfully`);

    return release;
  });

/**
 * Prints a table given a list of releases
 */
function printReleaseDetails(release: Release): void {
  const metadataTable = new Table({
    head: ["Field", "Value"],
    style: { head: ["green"] },
    colWidths: [25, 100],
    wordWrap: true,
  });

  metadataTable.push(
    ["Release Name", release.name],
    ["Build Version", release.buildVersion],
    ["Display Version", release.displayVersion],
    ["Create Time", new Date(release.createTime).toLocaleString()],
    ["Release Notes", release.releaseNotes?.text ?? "No release notes provided."],
  );

  logger.info(metadataTable.toString());

  logger.info(clc.bold("Testing URI:"), release.testingUri ?? "N/A");
  logger.info(clc.bold("Firebase Console URI:"), release.firebaseConsoleUri ?? "N/A");
  logger.info(clc.bold("Binary Download URI:"), release.binaryDownloadUri ?? "N/A");
}
