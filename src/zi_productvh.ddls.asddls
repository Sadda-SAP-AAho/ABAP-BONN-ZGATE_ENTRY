@AbapCatalog.sqlViewName: 'ZI_PRODUCT_VH'
@AbapCatalog.compiler.compareFilter: true
@AbapCatalog.preserveKey: true
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Value Help For Product'
@Metadata.ignorePropagatedAnnotations: true
define view ZI_ProductVH  as 
  select from I_Product as pr
  join I_ProductDescription as pd on pr.Product = pd.Product and pd.LanguageISOCode = 'EN' 
  join I_UnitOfMeasureStdVH as un on un.UnitOfMeasure = pr.BaseUnit
{
    key pr.Product,
    pd.ProductDescription,
    ltrim(pr.Product,'0') as ProductAlias,
    pr.BaseUnit,
    un.UnitOfMeasureLongName
}
   
