const knex = require('knex');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'jobnexus.db');

const db = knex({
  client: 'sqlite3',
  connection: { filename: DB_PATH },
  useNullAsDefault: true,
  pool: {
    afterCreate: (conn, cb) => {
      conn.run('PRAGMA foreign_keys = ON', cb);
    }
  }
});

async function createIfMissing(tableName, builder) {
  const exists = await db.schema.hasTable(tableName);
  if (!exists) {
    await db.schema.createTable(tableName, builder);
    console.log(`  ✔ Created table: ${tableName}`);
  }
}

async function initDB() {
  await createIfMissing('users', t => {
    t.increments('id').primary();
    t.string('name').notNullable();
    t.string('email').unique().notNullable();
    t.string('password_hash').notNullable();
    t.string('role').defaultTo('jobseeker');
    t.string('phone');
    t.string('job_title');
    t.string('company_name');
    t.string('company_size');
    t.string('location');
    t.text('bio');
    t.text('skills');
    t.string('status').defaultTo('active');
    t.timestamp('created_at').defaultTo(db.fn.now());
  });

  await createIfMissing('jobs', t => {
    t.increments('id').primary();
    t.integer('employer_id').references('id').inTable('users').onDelete('CASCADE');
    t.string('title').notNullable();
    t.string('company').notNullable();
    t.string('location');
    t.string('salary');
    t.string('type').defaultTo('Full-time');
    t.boolean('remote').defaultTo(false);
    t.string('category');
    t.string('logo');
    t.string('logo_text');
    t.integer('posted_days').defaultTo(0);
    t.boolean('featured').defaultTo(false);
    t.text('description');
    t.text('skills');
    t.string('status').defaultTo('active');
    t.timestamp('created_at').defaultTo(db.fn.now());
  });

  await createIfMissing('companies', t => {
    t.increments('id').primary();
    t.string('name').notNullable();
    t.string('industry');
    t.string('location');
    t.string('employees');
    t.string('logo');
    t.string('logo_text');
    t.integer('jobs').defaultTo(0);
    t.float('rating').defaultTo(0);
    t.text('description');
    t.timestamp('created_at').defaultTo(db.fn.now());
  });

  await createIfMissing('applications', t => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.integer('job_id').notNullable().references('id').inTable('jobs').onDelete('CASCADE');
    t.string('status').defaultTo('pending');
    t.timestamp('applied_at').defaultTo(db.fn.now());
    t.unique(['user_id', 'job_id']);
  });

  await createIfMissing('saved_jobs', t => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.integer('job_id').notNullable().references('id').inTable('jobs').onDelete('CASCADE');
    t.timestamp('saved_at').defaultTo(db.fn.now());
    t.unique(['user_id', 'job_id']);
  });

  console.log('✅ Database ready');
}

module.exports = { db, initDB };
