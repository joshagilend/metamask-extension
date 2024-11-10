import fetch from 'node-fetch';

const CIRCLE_TOKEN = process.env.CIRCLE_OIDC_TOKEN_V2;

/**
 * Fetches the last 20 CircleCI workflows for 'develop' branch.
 *
 * @returns {Promise<any[]>} A promise that resolves to an array of workflow items.
 * @throws Will throw an error if the CircleCI token is not defined or if the HTTP request fails.
 */
async function getCircleCiWorkflowsByBranch(branch: string): Promise<any[]> {
  if (!CIRCLE_TOKEN) {
    throw new Error('CircleCI token is not defined');
  }

  const url = `https://circleci.com/api/v2/project/github/${process.env.CIRCLE_PROJECT_USERNAME}/${process.env.CIRCLE_PROJECT_REPONAME}/pipeline?branch=${branch}`;
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Circle-Token': CIRCLE_TOKEN,
    }
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const body = await response.json();
    return body.items;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

/**
 * Reruns a CircleCI workflow by its ID.
 *
 * @param {string} workflowId - The ID of the workflow to rerun.
 * @throws Will throw an error if the CircleCI token is not defined or if the HTTP request fails.
 */
async function rerunWorkflowById(workflowId: string) {
  if (!CIRCLE_TOKEN) {
    throw new Error('CircleCI token is not defined');
  }

  const url = `https://circleci.com/api/v2/workflow/${workflowId}/rerun`;
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Circle-Token': CIRCLE_TOKEN,
    },
    body: JSON.stringify({
      enable_ssh: false,
      from_failed: true,
      sparse_tree: false,
    })
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const body = await response.json();
    console.log(body);
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Re-runs failed CircleCI workflows from develop branch.
 * The workflow will only be re-runed if
 *   1. It has only been run once
 *   2. It has the status of 'failed'
 *
 * @throws Will throw an error if fetching the workflows or re-running a workflow fails.
 */
async function rerunFailedWorkflowsFromDevelop() {
  try {
    const workflows = await getCircleCiWorkflowsByBranch('develop');
    for (const workflow of workflows) {
      const workflowIds = workflow.WorkflowIDs;

      if (
        workflowIds.length === 1 &&
        workflow.state === 'failed'
      ) {
        await rerunWorkflowById(workflow.id);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

rerunFailedWorkflowsFromDevelop();