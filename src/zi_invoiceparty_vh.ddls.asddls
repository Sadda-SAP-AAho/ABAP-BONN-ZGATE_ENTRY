@AbapCatalog.viewEnhancementCategory: [#NONE]
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Invoicing Party Value Help'
@Metadata.ignorePropagatedAnnotations: true
@ObjectModel.usageType:{
    serviceQuality: #X,
    sizeCategory: #S,
    dataClass: #MIXED
}
define view entity ZI_InvoiceParty_VH as 
    select from I_Supplier
    {
        key Supplier                    as              InvoicingParty,
        SupplierName                    as              InvoicingPartyName,
        SupplierAccountGroup            as              InvoicingPartyAccountGroup,
        BusinessPartnerPanNumber        as              InvoicingPartyPAN,
        SupplierFullName                as              InvoicingPartyFullName,
        TaxNumber3                      as              InvoicingPartyGST
    }
