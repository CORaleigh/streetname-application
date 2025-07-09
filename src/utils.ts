export const getFieldAlias = (
  fieldName: string,
  layer: __esri.FeatureLayer
) => {
  const field = layer.fields.find(
    (field: __esri.Field) => fieldName === field.name
  );
  if (!field) return fieldName;
  return field.alias;
};

export const toTitleCase = (str: string) => {
  return str.replace(/\w\S*/g, (txt: string) => {
    return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
  });
};
