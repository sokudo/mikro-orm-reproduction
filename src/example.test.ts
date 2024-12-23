import {
  Collection,
  Entity,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
  Rel,
  Unique,
} from "@mikro-orm/sqlite";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";

class IdGen {
  id = 0;
  next = () =>  this.id++;
}

const genId = new IdGen().next;


@Entity()
export class RepoModel {
  @PrimaryKey()
  id!: number;

  @OneToMany(() => CommitModel, (c) => c.repo, { orphanRemoval: true })
  commits = new Collection<CommitModel>(this);

  constructor(x: Partial<RepoModel>) {
    this.id = x.id ?? genId();
  }
}

@Entity()
@Unique({ properties: ["repo", "sha"] })
export class CommitModel {
  @PrimaryKey()
  id!: number;

  @Property()
  sha!: string;

  @ManyToOne()
  repo!: RepoModel;

  @ManyToOne()
  tree!: Rel<TreeModel>;

  constructor(x: Partial<CommitModel> & Pick<CommitModel, "sha" | "repo">) {
    this.id = x.id ?? genId();
    this.sha = x.sha;
    this.repo = x.repo;
    if (x.tree) {
      this.tree = x.tree;
    }
  }
}

@Entity()
@Unique({ properties: ["repo", "sha"] })
export class TreeModel {
  @PrimaryKey()
  id!: number;

  @Property()
  sha!: string;

  @ManyToOne()
  repo!: RepoModel;

  @ManyToOne()
  commit!: CommitModel;

  constructor(x: Partial<TreeModel> & Pick<TreeModel, "sha" | "repo">) {
    this.id = x.id ?? genId();
    this.sha = x.sha;
    this.repo = x.repo;
    if (x.commit) {
      this.commit = x.commit;
    }
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: TsMorphMetadataProvider,
    dbName: ":memory:",
    entities: [RepoModel, CommitModel, TreeModel],
    debug: ["query", "query-params"],
    allowGlobalContext: true, // only for testing
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test("basic CRUD example", async () => {
  const repo = orm.em.create(RepoModel, {});
  const commit = new CommitModel({ sha: "repoSha", repo });
  const tree = new TreeModel({ sha: "treeSha", repo, commit });
  commit.tree = tree;
  orm.em.persist([commit, commit.tree]);
  expect(tree.commit.id).toBe(commit.id);
  await orm.em.flush();
  orm.em.clear();

  const repo1 = await orm.em.findOneOrFail(RepoModel, { id: repo.id });
  expect(repo1.id).toBe(repo.id);

  const tree1 = await orm.em.findOneOrFail(TreeModel, { repo, sha: "treeSha" });
  expect(tree1.sha).toBe("treeSha");
  expect(tree1.commit.id).toBe(commit.id);
  
  const count = await orm.em.count(RepoModel, { id: repo.id });
  expect(count).toBe(1);
});
