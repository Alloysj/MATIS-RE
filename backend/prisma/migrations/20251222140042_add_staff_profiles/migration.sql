-- CreateTable
CREATE TABLE "public"."staff_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."staff_profile_roles" (
    "staff_profile_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_profile_roles_pkey" PRIMARY KEY ("staff_profile_id","role_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_profiles_name_key" ON "public"."staff_profiles"("name");

-- AddForeignKey
ALTER TABLE "public"."staff_profile_roles" ADD CONSTRAINT "staff_profile_roles_staff_profile_id_fkey" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_profile_roles" ADD CONSTRAINT "staff_profile_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
