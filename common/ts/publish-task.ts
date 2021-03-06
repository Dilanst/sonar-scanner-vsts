import * as tl from 'vsts-task-lib/task';
import Analysis from './sonarqube/Analysis';
import Endpoint, { EndpointType, EndpointData } from './sonarqube/Endpoint';
import Metrics from './sonarqube/Metrics';
import Task from './sonarqube/Task';
import TaskReport from './sonarqube/TaskReport';
import { publishBuildSummary } from './helpers/vsts-server-utils';

export default async function publishTask(endpointType: EndpointType) {
  const params = tl.getVariable('SONARQUBE_SCANNER_PARAMS');
  if (!params) {
    tl.setResult(
      tl.TaskResult.Failed,
      `The ${endpointType} Prepare Analysis Configuration must be added.`
    );
    return;
  }

  const endpointData: { type: EndpointType; data: EndpointData } = JSON.parse(
    tl.getVariable('SONARQUBE_ENDPOINT')
  );
  const endpoint = new Endpoint(endpointData.type, endpointData.data);
  const metrics = await Metrics.getAllMetrics(endpoint);

  const taskReport = await TaskReport.createTaskReportFromFile();
  const task = await Task.waitForTaskCompletion(endpoint, taskReport.ceTaskId);
  const analysis = await Analysis.getAnalysis(
    task.analysisId,
    endpoint,
    metrics,
    taskReport.dashboardUrl
  );
  publishBuildSummary(analysis.getHtmlAnalysisReport(), endpoint.type);
}
