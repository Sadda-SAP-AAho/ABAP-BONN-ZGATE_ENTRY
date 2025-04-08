@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'CDS for Tax Code'
@Metadata.ignorePropagatedAnnotations: true
define root view entity ZR_TAXCODE as select from ztaxcode
{
    @EndUserText.label: 'Tax Code'
    key taxcode as Taxcode,
    @EndUserText.label: 'Description'
    description as Description,
    @EndUserText.label: 'Rate'
    rate as Rate,
    @Semantics.user.createdBy: true
    created_by as CreatedBy,
    @Semantics.systemDateTime.createdAt: true
    created_at as CreatedAt,
    @Semantics.user.localInstanceLastChangedBy: true
    last_changed_by as LastChangedBy,
    @Semantics.systemDateTime.localInstanceLastChangedAt: true
    last_changed_at as LastChangedAt,
    @Semantics.systemDateTime.lastChangedAt: true
    local_last_changed_at as LocalLastChangedAt
}
