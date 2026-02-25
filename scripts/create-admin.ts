/**
 * create-admin.ts — Creates an admin user and organization for GHOSTNET.
 *
 * Run via: npx tsx scripts/create-admin.ts --email admin@example.com --password secret --org "My Organization"
 * Or from setup: docker compose exec api npx tsx ../../scripts/create-admin.ts --email ... --password ... --org ...
 *
 * Requires DATABASE_URL to be set.
 */

import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10);

function parseArgs(): { email: string; password: string; org: string } {
  const args = process.argv.slice(2);
  let email = '';
  let password = '';
  let org = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      email = args[++i];
    } else if (args[i] === '--password' && args[i + 1]) {
      password = args[++i];
    } else if (args[i] === '--org' && args[i + 1]) {
      org = args[++i];
    }
  }

  if (!email || !password || !org) {
    console.error('Usage: npx tsx create-admin.ts --email <email> --password <password> --org "<org name>"');
    process.exit(1);
  }

  return { email, password, org };
}

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'organization';
}

async function main() {
  const { email, password, org } = parseArgs();

  // Find or create organization
  const slug = slugFromName(org);
  let organization = await prisma.organization.findFirst({
    where: {
      OR: [{ slug }, { name: org }],
    },
  });

  if (!organization) {
    organization = await prisma.organization.create({
      data: {
        name: org,
        slug: slug,
        plan: 'TRIAL',
        isDemo: false,
      },
    });
    console.log(`[create-admin] Created organization: ${organization.name} (${organization.slug})`);
  } else {
    console.log(`[create-admin] Using existing organization: ${organization.name} (${organization.slug})`);
  }

  // Create DeceptionConfig if not exists
  const existingConfig = await prisma.deceptionConfig.findUnique({
    where: { orgId: organization.id },
  });

  if (!existingConfig) {
    await prisma.deceptionConfig.create({
      data: {
        orgId: organization.id,
        iamEnabled: true,
        oauthEnabled: true,
        apiEnabled: true,
        secretsEnabled: true,
        s3Enabled: true,
        discoveryEnabled: true,
        lureDepth: 3,
        rateLimitEnabled: true,
      },
    });
    console.log(`[create-admin] Created deception config for org`);
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    if (existingUser.orgId !== organization.id) {
      console.error(`[create-admin] Error: User ${email} already exists in another organization`);
      process.exit(1);
    }
    // Update to admin and new password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { passwordHash, role: 'ADMIN' },
    });
    console.log(`[create-admin] Updated existing user to ADMIN role`);
    console.log('');
    console.log('✅ Admin user updated successfully!');
    console.log(`   Email:    ${email}`);
    console.log(`   Org:     ${organization.name}`);
    console.log(`   Role:    ADMIN`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: 'ADMIN' as Role,
      orgId: organization.id,
    },
  });

  console.log('');
  console.log('✅ Admin user created successfully!');
  console.log(`   ID:      ${user.id}`);
  console.log(`   Email:   ${user.email}`);
  console.log(`   Name:    ${user.name}`);
  console.log(`   Org:     ${organization.name} (${organization.slug})`);
  console.log(`   Role:    ADMIN`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error('[create-admin] Fatal error:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
