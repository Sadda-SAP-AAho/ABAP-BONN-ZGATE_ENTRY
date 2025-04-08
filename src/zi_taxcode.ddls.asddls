@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Interface CDS for Tax Code'
@Metadata.ignorePropagatedAnnotations: true
define root view entity ZI_TaxCode
  provider contract transactional_interface
 as projection on ZR_TAXCODE
{
    key Taxcode,
    Description,
    Rate,
    CreatedBy,
    CreatedAt,
    LastChangedBy,
    LastChangedAt,
    LocalLastChangedAt
}
