# MikroORM reproduction example

Tree.commit is set correctly and passes test on line 132.
Flush fails at line 133 reporting
`ValidationError: Value for TreeModel.commit is required, 'undefined' found`

Log excerpt:
```
ValidationError: Value for TreeModel.commit is required, 'undefined' found
    entity: TreeModel {
      sha: 'treeSha',
      repo: RepoModel {
        commits: Collection<CommitModel> { '0': [CommitModel], initialized: true, dirty: true },
        id: 0
      },
      id: 2
    }

      131 |     orm.em.persist([commit, commit.tree]);
      132 |     expect(tree.commit.id).toBe(commit.id);
    > 133 |     await orm.em.flush();
          |     ^
```
