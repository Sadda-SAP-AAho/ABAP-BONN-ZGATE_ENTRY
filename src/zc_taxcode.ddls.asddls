@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Project CDS for Tax Code'
@Metadata.ignorePropagatedAnnotations: true
@Metadata.allowExtensions: true
define root view entity ZC_TAXCODE
  provider contract transactional_query 
  as projection on ZR_TAXCODE
{
 key Taxcode,
 Description,
 Rate   ,
  CreatedBy,
    CreatedAt,
    LastChangedBy,
    LastChangedAt,
    LocalLastChangedAt    
}
