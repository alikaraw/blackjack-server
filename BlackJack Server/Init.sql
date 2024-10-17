CREATE SCHEMA `blackjack` ;

CREATE TABLE `blackjack`.`users` (
  `username` CHAR(16) NOT NULL,
  `password` VARCHAR(45) NOT NULL,
  `last_login` DATETIME NULL,
  `last_daily_reward` DATETIME NULL,
  `last_weekly_reward` DATETIME NULL,
  `weekly_streak` INT NULL,
  `balance` INT NULL,
  PRIMARY KEY (`username`),
  UNIQUE INDEX `username_UNIQUE` (`username` ASC) VISIBLE);

CREATE TABLE `blackjack`.`friend_requests` (
  `sender` VARCHAR(45) NOT NULL,
  `receiver` VARCHAR(45) NOT NULL,
  `accepted` TINYINT NOT NULL,
  PRIMARY KEY (`sender`, `receiver`));