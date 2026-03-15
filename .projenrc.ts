import { awscdk, github } from 'projen';
const project = new awscdk.AwsCdkConstructLibrary({
  author: 'WinterYukky',
  authorAddress: '49480575+WinterYukky@users.noreply.github.com',
  cdkVersion: '2.238.0',
  defaultReleaseBranch: 'main',
  jsiiVersion: '~5.9.0',
  name: 'aws-cdk-lambdaless-custom-resource',
  projenrcTs: true,
  repositoryUrl:
    'https://github.com/WinterYukky/aws-cdk-lambdaless-custom-resource',
  keywords: [
    'cloudformation',
    'custom-resource',
    'step-functions',
    'lambdaless',
  ],
  eslintOptions: {
    dirs: ['src'],
    ignorePatterns: ['test/**/*.snapshot/**'],
    prettier: true,
  },
  prettier: true,
  prettierOptions: {
    settings: {
      singleQuote: true,
    },
  },
  deps: [],
  description:
    'AWS CDK construct library for creating CloudFormation custom resources without Lambda functions, using Step Functions instead',
  devDeps: ['@aws-cdk/integ-tests-alpha'],
  githubOptions: {
    projenCredentials: github.GithubCredentials.fromApp(),
    pullRequestLintOptions: {
      semanticTitleOptions: {
        types: [
          'feat',
          'fix',
          'chore',
          'ci',
          'docs',
          'style',
          'refactor',
          'test',
          'revert',
          'Revert',
        ],
      },
      contributorStatement:
        '_By submitting this pull request, I confirm that my contribution is made under the terms of the Apache-2.0 license_',
      contributorStatementOptions: {
        exemptLabels: ['auto-upgrade'],
      },
    },
  },
  depsUpgradeOptions: {
    workflowOptions: {
      labels: ['auto-upgrade'],
    },
  },
  experimentalIntegRunner: true,
  autoApproveOptions: {
    allowedUsernames: ['winteryukky-projen-bot[bot]'],
    label: 'auto-upgrade',
  },
  tsconfig: {
    compilerOptions: {
      experimentalDecorators: true,
    },
  },
  tsconfigDev: {
    compilerOptions: {
      experimentalDecorators: true,
    },
  },
  npmTrustedPublishing: true,
});
const autoApproveWorkflow = project.github?.tryFindWorkflow('auto-approve');
const approveJob = autoApproveWorkflow?.getJob('approve');
if (approveJob && 'steps' in approveJob) {
  autoApproveWorkflow?.updateJob('approve', {
    ...approveJob,
    steps: [
      {
        name: 'Generate token',
        id: 'generate_token',
        uses: 'actions/create-github-app-token@3ff1caaa28b64c9cc276ce0a02e2ff584f3900c5',
        with: {
          'app-id': '${{ secrets.PROJEN_APP_ID }}',
          'private-key': '${{ secrets.PROJEN_APP_PRIVATE_KEY }}',
        },
      },
      {
        name: 'Auto approve',
        uses: 'hmarr/auto-approve-action@f0939ea97e9205ef24d872e76833fa908a770363',
        with: {
          'github-token': '${{ steps.generate_token.outputs.token }}',
        },
      },
    ],
  });
}

project.synth();
