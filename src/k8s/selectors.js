import { get, has } from 'lodash';

import { getTemplatesLabelValues, getTemplatesWithLabels, getTemplate } from '../utils/templates';
import { VirtualMachineModel } from '../models';

import {
  CUSTOM_FLAVOR,
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_OS_LABEL,
  TEMPLATE_WORKLOAD_LABEL,
  TEMPLATE_TYPE_BASE,
  TEMPLATE_TYPE_VM,
} from '../constants';

import {
  PROVISION_SOURCE_TYPE_KEY,
  OPERATING_SYSTEM_KEY,
  FLAVOR_KEY,
  WORKLOAD_PROFILE_KEY,
} from '../components/Wizard/CreateVmWizard/constants';

export const settingsValue = (basicSettings, key, defaultValue) => get(basicSettings, [key, 'value'], defaultValue);

export const getLabel = (basicSettings, labelPrefix, value) =>
  has(basicSettings, value) ? `${labelPrefix}/${settingsValue(basicSettings, value)}` : undefined;

export const getWorkloadLabel = basicSettings => getLabel(basicSettings, TEMPLATE_WORKLOAD_LABEL, WORKLOAD_PROFILE_KEY);
export const getOsLabel = basicSettings => getLabel(basicSettings, TEMPLATE_OS_LABEL, OPERATING_SYSTEM_KEY);

export const getOperatingSystems = (basicSettings, templates, userTemplate) => {
  let templatesWithLabels;
  if (userTemplate) {
    templatesWithLabels = [getTemplate(templates, TEMPLATE_TYPE_VM).find(t => t.metadata.name === userTemplate)];
  } else {
    templatesWithLabels = getTemplatesWithLabels(getTemplate(templates, TEMPLATE_TYPE_BASE), [
      getWorkloadLabel(basicSettings),
      getFlavorLabel(basicSettings),
    ]);
  }
  return getTemplateOperatingSystems(templatesWithLabels);
};

export const getWorkloadProfiles = (basicSettings, templates, userTemplate) => {
  let templatesWithLabels;
  if (userTemplate) {
    templatesWithLabels = [getTemplate(templates, TEMPLATE_TYPE_VM).find(t => t.metadata.name === userTemplate)];
  } else {
    templatesWithLabels = getTemplatesWithLabels(getTemplate(templates, TEMPLATE_TYPE_BASE), [
      getOsLabel(basicSettings),
      getFlavorLabel(basicSettings),
    ]);
  }
  return getTemplateWorkloadProfiles(templatesWithLabels);
};

export const getFlavorLabel = basicSettings => {
  if (has(basicSettings, [FLAVOR_KEY, 'value'])) {
    const flavorValue = basicSettings.flavor.value;
    if (flavorValue !== CUSTOM_FLAVOR) {
      return `${TEMPLATE_FLAVOR_LABEL}/${basicSettings.flavor.value}`;
    }
  }
  return undefined;
};

export const getFlavors = (basicSettings, templates, userTemplate) => {
  let templatesWithLabels;
  if (userTemplate) {
    templatesWithLabels = [getTemplate(templates, TEMPLATE_TYPE_VM).find(t => t.metadata.name === userTemplate)];
  } else {
    templatesWithLabels = getTemplatesWithLabels(getTemplate(templates, TEMPLATE_TYPE_BASE), [
      getWorkloadLabel(basicSettings),
      getOsLabel(basicSettings),
    ]);
  }
  const flavors = getTemplateFlavors(templatesWithLabels);
  if (!flavors.some(flavor => flavor === CUSTOM_FLAVOR)) {
    flavors.push(CUSTOM_FLAVOR);
  }
  return flavors;
};

export const getTemplateFlavors = templates => getTemplatesLabelValues(templates, TEMPLATE_FLAVOR_LABEL);

export const getTemplateOperatingSystems = templates => getTemplatesLabelValues(templates, TEMPLATE_OS_LABEL);

export const getTemplateWorkloadProfiles = templates => getTemplatesLabelValues(templates, TEMPLATE_WORKLOAD_LABEL);

export const isImageSourceType = (basicSettings, type) =>
  settingsValue(basicSettings, PROVISION_SOURCE_TYPE_KEY) === type;

export const isFlavorType = (basicSettings, type) => settingsValue(basicSettings, FLAVOR_KEY) === type;

export const getTemplateAnnotations = (template, name) => get(template.metadata.annotations, [name]);

export const selectVm = objects => objects.find(obj => obj.kind === VirtualMachineModel.kind);

export const getModelApi = model => `${model.apiGroup}/${model.apiVersion}`;
