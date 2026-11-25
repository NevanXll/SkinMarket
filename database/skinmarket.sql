-- SkinMarket Pro. Esquema, catálogo base y migraciones.

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts` (
  `id` varchar(64) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(254) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL,
  `blocked` bit(1) NOT NULL DEFAULT b'0',
  `balance` decimal(19,2) NOT NULL DEFAULT '12500.00',
  `auth_version` bigint NOT NULL DEFAULT '0',
  `version` bigint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  CONSTRAINT `ck_account_role` CHECK ((`role` in (_utf8mb4'ADMIN',_utf8mb4'CLIENTE',_utf8mb4'VENDEDOR'))),
  CONSTRAINT `ck_balance` CHECK ((`balance` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `id` varchar(64) NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `product_id` varchar(64) NOT NULL,
  `quantity` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cart` (`user_id`,`product_id`),
  KEY `fk_cart_product` (`product_id`),
  CONSTRAINT `fk_cart_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ck_quantity` CHECK ((`quantity` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flyway_schema_history` (
  `installed_rank` int NOT NULL,
  `version` varchar(50) DEFAULT NULL,
  `description` varchar(200) NOT NULL,
  `type` varchar(20) NOT NULL,
  `script` varchar(1000) NOT NULL,
  `checksum` int DEFAULT NULL,
  `installed_by` varchar(100) NOT NULL,
  `installed_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `execution_time` int NOT NULL,
  `success` tinyint(1) NOT NULL,
  PRIMARY KEY (`installed_rank`),
  KEY `flyway_schema_history_s_idx` (`success`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` varchar(64) NOT NULL,
  `name` varchar(100) NOT NULL,
  `weapon` varchar(255) DEFAULT NULL,
  `finish` varchar(255) DEFAULT NULL,
  `category` varchar(255) NOT NULL,
  `rarity` varchar(255) NOT NULL,
  `color` varchar(255) DEFAULT NULL,
  `price` decimal(19,2) NOT NULL,
  `stock` int NOT NULL,
  `collection` varchar(255) DEFAULT NULL,
  `wear` varchar(255) DEFAULT NULL,
  `image` varchar(1000) NOT NULL,
  `featured` bit(1) NOT NULL DEFAULT b'0',
  `deleted` bit(1) NOT NULL DEFAULT b'0',
  `version` bigint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  CONSTRAINT `ck_price` CHECK ((`price` >= 0)),
  CONSTRAINT `ck_stock` CHECK ((`stock` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchases` (
  `id` varchar(64) NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `request_key` varchar(255) NOT NULL,
  `created_at` timestamp(6) NOT NULL,
  `total` decimal(19,2) NOT NULL,
  `items_json` longtext NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_purchase_request` (`user_id`,`request_key`),
  KEY `ix_purchase_user_date` (`user_id`,`created_at`),
  CONSTRAINT `fk_purchase_user` FOREIGN KEY (`user_id`) REFERENCES `accounts` (`id`),
  CONSTRAINT `ck_total` CHECK ((`total` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_sessions` (
  `hash` varchar(64) NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `expires_at` timestamp(6) NOT NULL,
  `auth_version` bigint NOT NULL,
  PRIMARY KEY (`hash`),
  KEY `fk_refresh_user` (`user_id`),
  CONSTRAINT `fk_refresh_user` FOREIGN KEY (`user_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seller_applications` (
  `user_id` varchar(64) NOT NULL,
  `skins` varchar(500) NOT NULL,
  `reason` varchar(1000) NOT NULL,
  `status` varchar(16) NOT NULL,
  `submitted_at` timestamp(6) NOT NULL,
  `reviewed_at` timestamp(6) NULL DEFAULT NULL,
  `review_note` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_seller_applicant` FOREIGN KEY (`user_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ck_seller_application_status` CHECK ((`status` in (_utf8mb4'PENDIENTE',_utf8mb4'APROBADA',_utf8mb4'RECHAZADA')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;


SET NAMES utf8mb4;
INSERT INTO `products` VALUES ('skin-09205674e246','AK-47 | Asiimov','AK-47','Asiimov','Rifles','Covert','#eb4b4b',180.00,5,'The Danger Zone Collection','Factory New','images/skins/skin-09205674e246.png',_binary '\0',_binary '\0',0),('skin-2599a8720f89','AK-47 | Fire Serpent','AK-47','Fire Serpent','Rifles','Covert','#eb4b4b',3200.00,2,'The Bravo Collection','Factory New','images/skins/skin-2599a8720f89.png',_binary '',_binary '\0',0),('skin-318f343e125d','SSG 08 | Dragonfire','SSG 08','Dragonfire','Rifles','Covert','#eb4b4b',22.00,5,'The Glove Collection','Factory New','images/skins/skin-318f343e125d.png',_binary '\0',_binary '\0',0),('skin-32a30647e564','Desert Eagle | Printstream','Desert Eagle','Printstream','Pistolas','Covert','#eb4b4b',420.00,5,'The Fracture Collection','Factory New','images/skins/skin-32a30647e564.png',_binary '',_binary '\0',0),('skin-4f8d99d09ded','AWP | Dragon Lore','AWP','Dragon Lore','Rifles','Covert','#eb4b4b',8450.00,1,'The Cobblestone Collection','Factory New','images/skins/skin-4f8d99d09ded.png',_binary '',_binary '\0',0),('skin-525ac56c082c','Karambit | Doppler','Karambit','Doppler','Cuchillos','Covert','#eb4b4b',5750.00,4,'Colección especial','Factory New','images/skins/skin-525ac56c082c.png',_binary '',_binary '\0',0),('skin-63c1d72b8501','M4A1-S | Black Lotus','M4A1-S','Black Lotus','Rifles','Classified','#d32ce6',235.00,7,'The Kilowatt Collection','Factory New','images/skins/skin-63c1d72b8501.png',_binary '\0',_binary '\0',0),('skin-6656ae9270b9','Butterfly Knife | Fade','Butterfly Knife','Fade','Cuchillos','Covert','#eb4b4b',2900.00,8,'Colección especial','Factory New','images/skins/skin-6656ae9270b9.png',_binary '\0',_binary '\0',0),('skin-6d14d557c648','MP9 | Food Chain','MP9','Food Chain','Subfusiles','Classified','#d32ce6',12.00,6,'The Snakebite Collection','Factory New','images/skins/skin-6d14d557c648.png',_binary '\0',_binary '\0',0),('skin-7b1351c2adba','M4A1-S | Hyper Beast','M4A1-S','Hyper Beast','Rifles','Covert','#eb4b4b',280.00,6,'The Chroma 2 Collection','Factory New','images/skins/skin-7b1351c2adba.png',_binary '',_binary '\0',0),('skin-7b1ef066823d','AWP | Neo-Noir','AWP','Neo-Noir','Rifles','Covert','#eb4b4b',260.00,2,'The Danger Zone Collection','Factory New','images/skins/skin-7b1ef066823d.png',_binary '\0',_binary '\0',0),('skin-8aacf99e7f2f','M4A4 | Howl','M4A4','Howl','Rifles','Contraband','#e4ae39',6900.00,3,'Colección especial','Factory New','images/skins/skin-8aacf99e7f2f.png',_binary '',_binary '\0',0),('skin-8c5b9b7ce9f2','M4A4 | The Emperor','M4A4','The Emperor','Rifles','Covert','#eb4b4b',95.00,7,'The Prisma Collection','Factory New','images/skins/skin-8c5b9b7ce9f2.png',_binary '\0',_binary '\0',0),('skin-91a429af4a60','AK-47 | Redline','AK-47','Redline','Rifles','Classified','#d32ce6',48.00,8,'The Phoenix Collection','Factory New','images/skins/skin-91a429af4a60.png',_binary '\0',_binary '\0',0),('skin-a841a452bb30','Glock-18 | Gamma Doppler','Glock-18','Gamma Doppler','Pistolas','Covert','#eb4b4b',310.00,8,'The 2021 Train Collection','Factory New','images/skins/skin-a841a452bb30.png',_binary '\0',_binary '\0',0),('skin-bb633c21fc25','AWP | Asiimov','AWP','Asiimov','Rifles','Covert','#eb4b4b',150.00,6,'The Phoenix Collection','Factory New','images/skins/skin-bb633c21fc25.png',_binary '\0',_binary '\0',0),('skin-bb6ba9602776','MAC-10 | Neon Rider','MAC-10','Neon Rider','Subfusiles','Covert','#eb4b4b',120.00,4,'The Chroma 2 Collection','Factory New','images/skins/skin-bb6ba9602776.png',_binary '\0',_binary '\0',0),('skin-be37abed2b4d','USP-S | Printstream','USP-S','Printstream','Pistolas','Covert','#eb4b4b',290.00,1,'The Recoil Collection','Factory New','images/skins/skin-be37abed2b4d.png',_binary '\0',_binary '\0',0),('skin-c01d561550ed','P90 | Asiimov','P90','Asiimov','Subfusiles','Covert','#eb4b4b',35.00,4,'The Breakout Collection','Factory New','images/skins/skin-c01d561550ed.png',_binary '\0',_binary '\0',0),('skin-c70df63bf30b','FAMAS | Commemoration','FAMAS','Commemoration','Rifles','Covert','#eb4b4b',18.00,7,'The CS20 Collection','Factory New','images/skins/skin-c70df63bf30b.png',_binary '\0',_binary '\0',0),('skin-c879dd5925b2','Glock-18 | Water Elemental','Glock-18','Water Elemental','Pistolas','Classified','#d32ce6',25.00,3,'The Breakout Collection','Factory New','images/skins/skin-c879dd5925b2.png',_binary '\0',_binary '\0',0),('skin-cf4c11689014','USP-S | Kill Confirmed','USP-S','Kill Confirmed','Pistolas','Covert','#eb4b4b',125.00,1,'The Shadow Collection','Factory New','images/skins/skin-cf4c11689014.png',_binary '\0',_binary '\0',0),('skin-e30d23329629','Desert Eagle | Blaze','Desert Eagle','Blaze','Pistolas','Restricted','#8847ff',750.00,2,'The Dust Collection','Factory New','images/skins/skin-e30d23329629.png',_binary '\0',_binary '\0',0),('skin-f10cd3871578','AK-47 | Ice Coaled','AK-47','Ice Coaled','Rifles','Classified','#d32ce6',175.00,0,'The Recoil Collection','Factory New','images/skins/skin-f10cd3871578.png',_binary '\0',_binary '\0',0);

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

LOCK TABLES `flyway_schema_history` WRITE;
/*!40000 ALTER TABLE `flyway_schema_history` DISABLE KEYS */;
INSERT INTO `flyway_schema_history` VALUES (1,'1','schema','SQL','V1__schema.sql',-766530468,'skinmarket','2026-11-21 21:12:16',1554,1),(2,'2','catalog','SQL','V2__catalog.sql',-1090486680,'skinmarket','2026-11-21 21:12:17',57,1),(3,'3','seller applications','SQL','V3__seller_applications.sql',-739060356,'skinmarket','2026-11-25 00:07:58',794,1);
/*!40000 ALTER TABLE `flyway_schema_history` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
