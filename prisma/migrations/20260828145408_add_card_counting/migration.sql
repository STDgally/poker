-- CreateTable
CREATE TABLE `CardCountingSession` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `system` ENUM('HI_LO', 'KO', 'OMEGA_II', 'RED_7', 'HI_OPT_I') NOT NULL,
    `practiceMode` ENUM('RUNNING_COUNT', 'TRUE_COUNT') NOT NULL,
    `level` INTEGER NOT NULL,
    `deckCount` INTEGER NOT NULL,
    `cardsSeen` INTEGER NOT NULL,
    `checkpoints` INTEGER NOT NULL,
    `correctCheckpoints` INTEGER NOT NULL,
    `avgAbsoluteError` DOUBLE NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endedAt` DATETIME(3) NULL,

    INDEX `CardCountingSession_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CardCountingSession` ADD CONSTRAINT `CardCountingSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
